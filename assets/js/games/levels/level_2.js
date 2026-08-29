/**
 * ArcadeVerse Level Data Configuration
 * Level ID: 2
 * Procedurally defined layout vectors coordinates.
 */

const Level_2_Data = {
    id: 2,
    bg: '#08172b',
    grid: [
        "                              #        #        #C      E                  #             C           #                # #                             ",
        "           #               #E        C  #             #      E                     #                   #                     C      ##                ",
        "              #  C          E       E      C                 C^                  #                            C         C          C                  ",
        "               #  #   E        #  E#  #                          C       C        #    ^              #          E                                    ",
        "                  #C                   #C         C  C    C       E         #  #        #     C     E             ^   C         C          #          ",
        "              #      #                       #       #   E        ###^    ## CC             E               ^     #              #          #         ",
        "         #  #               #                 C              #                          E                          #         #   E                    ",
        "                        E C                      #  #                             E       C E  E         E      ^     C                               ",
        "       C     C    #          # C           #                                 #   C C                  C        #       C            ^       #         ",
        "         ^       #     #                    #              C         ^           C#                        #      #C     #      E                     ",
        "          #                                     #  C   E                       ###   E       #                   ^          #                         ",
        "             #         E  #   #                                             C # C          #            C                          E                  ",
        "                 # E  #       #                                #                      #      E    # ^            #  ^        #      #E                ",
        "  S     E                                                      EC     C E      #                                     #C       #               Exit    ",
        "######################################################################################################################################################",
    ]
};

// Push into global platform levels repository
if (!window.ArcadeLevels) window.ArcadeLevels = [];
window.ArcadeLevels.push(Level_2_Data);
