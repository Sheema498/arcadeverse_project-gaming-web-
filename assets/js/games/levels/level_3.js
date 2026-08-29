/**
 * ArcadeVerse Level Data Configuration
 * Level ID: 3
 * Procedurally defined layout vectors coordinates.
 */

const Level_3_Data = {
    id: 3,
    bg: '#20081d',
    grid: [
        "     C                                   # ##    ##                 C      C                                     E  #                  CE #           ",
        "         C                      #^           #      E C#      #                         #                E                    #           C           ",
        "         E                          #                            #            C #E    E        #       ##         C#                      #           ",
        "       E         ^       C C        #                    #  #                  C     E               C                         #       EC             ",
        "            C                                                    #           C                           #     #            EC   #                    ",
        "          C  CC     #                          C       E     #  E            E#   E#              E #   C       ^C      #         #                   ",
        "          E            #                     C  # C                E  E            E   ^ #   E ^                   # #            #    C    #         ",
        "            C   #                                     ^C   C    # ^                           E      C  C     #          CC       C#   CC   ^         ",
        "                    #          #       E           C#      ^              ^     C  E  C    C          EC         #   ^ E              #  E CC         ",
        "      E#                       C E    C   C                          E     # C C                                   #        #     #   ^   #           ",
        "              C            E        C  #C      # #     #    E  C            #   E          #E                           C                             ",
        "                        #          C              #                   C #     #               ^   #   ^          #   C     C  ^                       ",
        "                                        E        E# E       E E C#E     C           #    #      #                          E   E#                     ",
        "  S       E C   C     ^   C   #         C E    E                                       #       E     C    E                      #    C       Exit    ",
        "######################################################################################################################################################",
    ]
};

// Push into global platform levels repository
if (!window.ArcadeLevels) window.ArcadeLevels = [];
window.ArcadeLevels.push(Level_3_Data);
