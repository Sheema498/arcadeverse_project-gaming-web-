/**
 * ArcadeVerse Level Data Configuration
 * Level ID: 8
 * Procedurally defined layout vectors coordinates.
 */

const Level_8_Data = {
    id: 8,
    bg: '#052c1a',
    grid: [
        "                  E      #C         #      #             #                                  #         #  ^  C #    ^     #   #   C   #    #           ",
        "     #                                   #      C      #          E                              C                 #                    #  #          ",
        "            E           C   #   #                          #    C              # #  #     #   C    #  #       C               C                       ",
        "       C     C#    E                    C                   C           #                     #                   E                  #                ",
        "        # #   C                          C              C    C     C      #                       C     C              #   C    C                     ",
        "                                                    CE                        # #          C^  C                   ^             C                    ",
        "        # C                 C #       ^            ^     E           C#      C         # #                      # C #                   ^  C          ",
        "            E            #                                                 C                    #C              C                                     ",
        "        E                   #         ^     C      E C            C        #         #                           #  C    C   #      #      C          ",
        "             E    E    # ^                   C        ##   ^#                      # #  C                 #      C           E #                      ",
        "         #  C       E              EC       C   E                                                   #    #           C  C#        E   #               ",
        "                    E  E#                          C             E  E     #   #  ^#          C  #            #    C                         C         ",
        "               C       E C                 # #         ^   # ^           #  E  #         #           ^                 E E    C                       ",
        "  S     #    #                 E #      C  E       C   #       ^         ^       ^        E             E            ^    #                   Exit    ",
        "######################################################################################################################################################",
    ]
};

// Push into global platform levels repository
if (!window.ArcadeLevels) window.ArcadeLevels = [];
window.ArcadeLevels.push(Level_8_Data);
