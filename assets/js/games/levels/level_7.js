/**
 * ArcadeVerse Level Data Configuration
 * Level ID: 7
 * Procedurally defined layout vectors coordinates.
 */

const Level_7_Data = {
    id: 7,
    bg: '#2c0511',
    grid: [
        "         E C  #                   E      C E       ^  C#      #                  C#            ##C       # #                    ^C                    ",
        "                     #         #                      E                     #                 #                         C        E     E              ",
        "            ##     C                        #            #                    C  #                                 EE     # E      #    C             ",
        "                                C    E          E             ^        C                             E                C                     C         ",
        "         C          #C    C            C  E                  #   #                    C            C                              #                   ",
        "       E       #             #        #       C #C C                  C       #          C          #           #               #                     ",
        "            E   #                 E#  E  #         #      #                               C    C                        #             ^               ",
        "           C    C         #                              EC                          C   #        #    #        #                  #E                 ",
        "             #              #                            C          #     #    #   EC  ##        E                 #  #            #        E         ",
        "              #   #         #        C E  EC                  ^ #   C                                   #                 #           #               ",
        "                E                                       E             C   #       #    E     C   C    E ^   C #            E   #          C           ",
        "              #              C      ^                             #          E  #  C    ^                 ^  ^  C   E                      C          ",
        "                          #          E    #  E    E  E  E               E        #                       C #   #                C                     ",
        "  S         E      C    E                   #          C         #                   ^                    C                          #  #   ^ Exit    ",
        "######################################################################################################################################################",
    ]
};

// Push into global platform levels repository
if (!window.ArcadeLevels) window.ArcadeLevels = [];
window.ArcadeLevels.push(Level_7_Data);
